export type Paginated<T = any> = {
  data: T[];
  meta: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};
