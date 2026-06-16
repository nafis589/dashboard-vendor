export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Impossible de lire le fichier'));
    reader.readAsDataURL(file);
  });
}

export async function filesToDataUrls(files: File[]): Promise<string[]> {
  return Promise.all(files.map(fileToDataUrl));
}
