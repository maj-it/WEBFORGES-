import { useState, useRef } from 'react';
import * as aiService from '../services/gemini';
import { PROJECT_TYPES } from '../App';
import { parseMultiFiles } from '../utils';

export const useGeneration = (
  currentProject: any,
  currentFiles: any,
  selectedModel: string,
  selectedType: string,
  updateProjectCode: any,
  addLog: any,
  trackEvent: any,
  fetchProactiveSuggestions: any,
  parseMultiFiles: any,
  setActiveTab: any,
  isPreviewable: boolean,
  aiError: any,
  setAiError: any
) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [tokensPerSec, setTokensPerSec] = useState(0);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  const [lastGeneration, setLastGeneration] = useState<{ prompt: string, code: string } | null>(null);
  const lastPromptRef = useRef<string>("");

  const handleAIError = (error: any) => {
    let message = 'Erreur inconnue (Neural desync)';
    
    if (typeof error === 'string') {
      if (error.trim().startsWith('<')) {
        message = 'Le kernel a renvoyé une page HTML au lieu de JSON. Le serveur est peut-être en train de redémarrer.';
      } else {
        message = error;
      }
    } else if (error instanceof Error) {
      const errMessage = error.message;
      if (errMessage.includes('fetch') || errMessage.includes('NetworkError')) {
        message = 'Liaison réseau rompue. Vérifiez que la console affiche "Server running".';
      } else if (errMessage.includes('Unexpected token') || errMessage.includes('is not valid JSON')) {
        message = 'Format de données corrompu (HTML reçu). Le cluster est possiblement en maintenance.';
      } else if (errMessage.includes('abort') || errMessage.includes('canceled')) {
        message = 'Opération interrompue.';
      } else if (errMessage.includes('429') || errMessage.includes('Throttled')) {
        message = 'Capacité maximale atteinte. Réessayez dans quelques secondes.';
      } else {
        message = errMessage;
      }
    } else if (error?.message) {
      message = error.message;
    }
    
    setAiError({ 
      message, 
      type: 'error',
      retryFn: lastPromptRef.current 
    });
  };

  const handleGenerate = async (e?: React.FormEvent, customP?: string) => {
    if (e) e.preventDefault();
    const finalP = customP || lastPromptRef.current;
    if (!finalP.trim() || isGenerating) return;

    lastPromptRef.current = finalP;
    setAiError(null);
    setIsGenerating(true);
    setTokensPerSec(0);
    const startTime = Date.now();
    const controller = new AbortController();
    setAbortController(controller);
    
    trackEvent('generate_start', { prompt: finalP, model: selectedModel, timestamp: Date.now() });

    let retries = 3;
    while (retries > 0) {
      try {
        const typeInfo = PROJECT_TYPES.find(t => t.id === currentProject?.type) || PROJECT_TYPES[0];
        addLog(`NEURAL_FORGE: Engaging Gemini Core for ${typeInfo.name} synthesis... (Retries left: ${retries - 1})`);
        
        const systemPrompt = `Tu es WebForge OS — le générateur d'applications web le plus avancé.
  Tu génères des SaaS COMPLETS et FONCTIONNELS avec architecture moderne.
  Utilise toujours ---FILE: path/to/file.ext--- separators for every file.
  FORGE_TYPE: ${typeInfo.name}. ${typeInfo.prompt}
  Current Project State: ${JSON.stringify(currentFiles || {})}`;
        
        let resultText = '';
        let charCount = 0;

        const stream = aiService.generateContentStream(finalP, systemPrompt, selectedModel, selectedType, controller.signal);

        for await (const chunk of stream) {
          if (chunk) {
            resultText += chunk;
            charCount += chunk.length;
            const now = Date.now();
            const elapsed = (now - startTime) / 1000;
            if (elapsed > 0) {
              setTokensPerSec(Math.round(charCount / elapsed));
            }
          }
        }

        const newFiles = parseMultiFiles(resultText);
        trackEvent('generate_success', { duration: Date.now() - startTime, tokens: resultText.length, type: typeInfo.id });
        await updateProjectCode(newFiles, finalP);
        
        setLastGeneration({ prompt: finalP, code: resultText });
        fetchProactiveSuggestions(finalP, typeInfo.id);
        
        if (isPreviewable) {
          setActiveTab('preview');
        } else {
          setActiveTab('editor');
          setAiError({ message: "Code généré avec succès ! Consultez l'onglet SOURCE.", type: 'success' });
        }
        break;
      } catch (err: any) { 
        if (err.name === 'AbortError') break;
        retries--;
        if (retries === 0) {
          trackEvent('generate_error', { error_code: err.status || 500, timestamp: Date.now() });
          handleAIError(err);
        } else {
          addLog(`NEURAL_FORGE: Kernel error detected. Initiating retry ${3 - retries}...`);
          await new Promise(r => setTimeout(r, 1000));
        }
      } finally { 
        if (retries === 0 || !isGenerating) {
          setIsGenerating(false);
          setAbortController(null);
        }
      }
    }
    setIsGenerating(false);
    setAbortController(null);
  };

  const handleAIQuickAction = async (action: string) => {
    if (!currentProject || !currentProject.activeFile || isGenerating) return;
    setIsGenerating(true);
    setAiError(null);
    addLog(`AI_KERNEL: Preparing ${action.toUpperCase()} for ${currentProject.activeFile}...`);

    try {
      const res = await aiService.generateContent(`Perform an advanced ${action} on the following file "${currentProject.activeFile}". Return the improved code ONLY. No explanations, no markdown blocks if possible, just the raw code.\n\nContext of other project files: ${JSON.stringify(currentFiles)}\n\nTARGET_CODE:\n${currentFiles[currentProject.activeFile]}`, selectedModel, selectedType);

      const resText = res.text;
      
      if (resText) {
        const codeMatch = resText.match(/```(?:\w+)?\n([\s\S]*?)```/) || [null, resText];
        const finalCode = (codeMatch[1] || resText).trim();

        const updatedFiles = { ...currentFiles, [currentProject.activeFile]: finalCode };
        updateProjectCode(updatedFiles, `AI ${action.toUpperCase()} - Refined Kernel State`);
        setAiError({ message: `${action.charAt(0).toUpperCase() + action.slice(1)} completed ✓`, type: 'success' });
        addLog(`AI_KERNEL: ${action.toUpperCase()} successful. Kernel state updated.`);
      }
    } catch (err: any) {
      handleAIError(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    tokensPerSec,
    aiError,
    setAiError,
    handleGenerate,
    handleAIError,
    handleAIQuickAction,
    lastGeneration,
    lastPromptRef,
    stopGeneration: () => abortController?.abort(),
    setIsGenerating
  };
};
