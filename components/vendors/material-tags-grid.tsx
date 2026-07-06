type MaterialItem = {
  id: number;
  name: string;
};

type MaterialTagsGridProps = {
  materials: MaterialItem[];
};

export function MaterialTagsGrid({ materials }: MaterialTagsGridProps) {
  if (materials.length === 0) {
    return null;
  }

  return (
    <ul className="mt-2 grid grid-cols-2 gap-1.5">
      {materials.map((material) => (
        <li
          key={material.id}
          title={material.name}
          className="truncate rounded-md bg-surface px-2 py-1 text-xs text-muted"
        >
          {material.name}
        </li>
      ))}
    </ul>
  );
}
