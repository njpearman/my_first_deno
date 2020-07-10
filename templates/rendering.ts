export type Render = typeof renderEmpty; //() => Promise<string>;

export const renderEmpty = async () => {
  return new Promise<string>((resolve) => resolve(""));
};


