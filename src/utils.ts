export const parseMultiFiles = (text: string, currentFiles: Record<string, string>): Record<string, string> => {
  const files: Record<string, string> = { ...currentFiles };
  const regex = /---FILE: (.*?)---([\s\S]*?)(?=---FILE:|$)/g;
  let match;
  let found = false;
  while ((match = regex.exec(text)) !== null) {
    const fileName = match[1].trim();
    const content = match[2].trim();
    files[fileName] = content;
    found = true;
  }
  return found ? files : { 'index.html': text };
};
