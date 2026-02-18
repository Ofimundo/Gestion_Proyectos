export const generateProjectCode = (projectName: string): string => {
  // Tomar primeras 4 letras del nombre (o completar con X)
  const letters = projectName
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 4)
    .padEnd(4, 'X');
  
  // Generar 4 números aleatorios
  const numbers = Math.floor(1000 + Math.random() * 9000).toString();
  
  return `${letters}-${numbers}`;
};

export const searchProjects = (projects: any[], searchTerm: string): any[] => {
  const term = searchTerm.toLowerCase();
  return projects.filter(project => 
    project.code.toLowerCase().includes(term) ||
    project.name.toLowerCase().includes(term) ||
    project.client.toLowerCase().includes(term) ||
    project.leader.toLowerCase().includes(term)
  );
};