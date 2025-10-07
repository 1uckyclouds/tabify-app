'use client';

interface StatusBarProps {
  selectedCount: number;
}

export default function StatusBar({ selectedCount }: StatusBarProps) {
  if (selectedCount === 0) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white px-4 py-2">
      <div className="text-sm">
        已选择 {selectedCount} 个标签页
      </div>
    </div>
  );
}