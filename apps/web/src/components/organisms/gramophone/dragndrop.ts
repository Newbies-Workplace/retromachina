const vinylPrivateKey = Symbol("Vinyl");

type Vinyl = {
  [vinylPrivateKey]: true;
  id: string;
};

export function getVinyl(data: Omit<Vinyl, typeof vinylPrivateKey>): Vinyl {
  return {
    [vinylPrivateKey]: true,
    ...data,
  };
}

export function isVinyl(data: Record<string | symbol, unknown>): data is Vinyl {
  return Boolean(data[vinylPrivateKey]);
}
