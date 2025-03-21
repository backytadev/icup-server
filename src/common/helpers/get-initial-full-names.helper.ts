interface Options {
  firstNames: string;
  lastNames: string;
}

export const getInitialFullNames = ({
  firstNames,
  lastNames,
}: Options): string => {
  const firstNamesValue = firstNames.split(' ');
  const lastNamesValue = lastNames.split(' ');

  return lastNames !== ''
    ? `${firstNamesValue[0]} ${lastNamesValue[0]}`
    : `${firstNamesValue[0]}`;
};

export const getFirstNameWithLastNames = ({
  firstNames,
  lastNames,
}: Options): string => {
  const firstNamesValue = firstNames.split(' ');
  const lastNamesValue = lastNames.split(' ');

  return lastNames !== ''
    ? `${firstNamesValue[0]} ${lastNamesValue[0]} ${lastNamesValue[1]}`
    : `${firstNamesValue[0]}`;
};
