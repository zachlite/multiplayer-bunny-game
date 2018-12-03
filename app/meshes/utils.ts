import * as _ from "lodash";

export const normalizeVertices = (vertices: number[][]) => {
  const max: number = _.max(_.flattenDeep(vertices));
  return vertices.map(pos => pos.map(n => n / max));
};

export const centerYAxis = (vertices: number[][]) => {
  const yCoords = vertices.map(pos => pos[1]);
  const maxY = _.max(yCoords);
  const halfway = maxY / 2;
  return vertices.map(v => {
    return [v[0], v[1] - halfway, v[2]];
  });
};
