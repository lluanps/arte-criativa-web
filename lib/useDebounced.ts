import { useEffect, useState } from "react";

/** Devolve `valor` só depois de ficar `atrasoMs` sem mudar — usado pra não disparar uma
 * busca na API a cada tecla digitada num campo de busca. */
export function useDebounced<T>(valor: T, atrasoMs = 350): T {
  const [debounced, setDebounced] = useState(valor);

  useEffect(() => {
    const temporizador = setTimeout(() => setDebounced(valor), atrasoMs);
    return () => clearTimeout(temporizador);
  }, [valor, atrasoMs]);

  return debounced;
}
