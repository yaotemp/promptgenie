export type Tag = {
  id: string;
  name: string;
  color: string;
};

export type Category = {
  id: string;
  name: string;
};

export type Prompt = {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: Tag[];
  isFavorite: boolean;
  dateCreated: string;
  dateModified: string;
};

export type PromptFormData = {
  id?: string;
  title: string;
  content: string;
  category: string;
  tags: Tag[];
};