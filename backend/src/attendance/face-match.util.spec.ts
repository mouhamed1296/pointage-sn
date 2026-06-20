import { euclideanDistance, findBestMatch } from './face-match.util';

describe('face-match.util', () => {
  describe('euclideanDistance', () => {
    it('vaut 0 pour deux vecteurs identiques', () => {
      expect(euclideanDistance([1, 2, 3], [1, 2, 3])).toBe(0);
    });

    it('calcule la distance correctement', () => {
      expect(euclideanDistance([0, 0], [3, 4])).toBe(5);
    });

    it('renvoie l’infini pour des dimensions différentes', () => {
      expect(euclideanDistance([1, 2], [1, 2, 3])).toBe(
        Number.POSITIVE_INFINITY,
      );
    });
  });

  describe('findBestMatch', () => {
    const candidates = [
      { id: 'a', faceDescriptor: [0, 0, 0] },
      { id: 'b', faceDescriptor: [10, 10, 10] },
      { id: 'c', faceDescriptor: null },
    ];

    it('retourne le candidat le plus proche sous le seuil', () => {
      const match = findBestMatch([0.1, 0.1, 0.1], candidates, 0.6);
      expect(match?.candidate.id).toBe('a');
    });

    it('retourne null si rien ne respecte le seuil', () => {
      const match = findBestMatch([5, 5, 5], candidates, 0.6);
      expect(match).toBeNull();
    });

    it('ignore les candidats sans descripteur', () => {
      const onlyNull = [{ id: 'c', faceDescriptor: null }];
      expect(findBestMatch([0, 0, 0], onlyNull, 1)).toBeNull();
    });
  });
});
