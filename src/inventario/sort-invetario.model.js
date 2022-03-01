export function sortInvetario(inventario) {
  return Array.from(inventario
    .reduce((acc, current) => {
      return acc.set(current.categoria, [...(acc.get(current.categoria) || []), current])
    } , new Map()))
    .sort((mappedArrayA, mappedArrayB) => (
      mappedArrayA[0] < mappedArrayB[0] ? -1 : mappedArrayA[0] === mappedArrayB[0] ? 0 : 1
    ))
    .reduce((acc, current) =>
      acc.concat(current[1].sort(sortArticulo))
    , []);
}

function sortArticulo(a, b) {
  const articuloA = a.articulo.toLowerCase().trim();
  const articuloB = b.articulo.toLowerCase().trim();
  return articuloA < articuloB ? -1 : articuloA === articuloB ? 0 : 1;
} 