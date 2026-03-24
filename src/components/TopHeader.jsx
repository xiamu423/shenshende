import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus } from 'lucide-react';
import './TopHeader.css';

export default function TopHeader({ title, showBack = false, showAdd = false, onAdd }) {
  const navigate = useNavigate();

  return (
    <header className="top-header">
      <div className="header-left">
        {showBack && (
          <button className="icon-btn" onClick={() => navigate(-1)}>
            <ChevronLeft size={24} />
          </button>
        )}
      </div>
      <h1 className="header-title">{title}</h1>
      <div className="header-right">
        {showAdd && (
          <button className="add-btn" onClick={onAdd}>
            <Plus size={20} color="white" />
          </button>
        )}
      </div>
    </header>
  );
}
