// DTO de apresentação do diretório; não importa o adaptador de integração.
export type RoutineDirectoryUser = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  position?: string | null;
};
