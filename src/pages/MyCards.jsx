// src/pages/MyCards.jsx
import { useNavigate } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import { useMockData } from '../contexts/MockData';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import MaterialModal from '../components/MaterialModal';

export default function MyCards() {
  const { myCards, deleteCard } = useMockData();
  const nav = useNavigate();
  const [selectedCard, setSelectedCard] = useState(null);

  return (
    <div className="page-container animate-fade-in" style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      <TopHeader title="我的物料卡" showBack={true} showAdd={true} onAdd={() => nav('/create-card')} />
      
      <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        {myCards.length === 0 ? (
          <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            您还没有创建过物料卡，点击右上角新建吧
          </div>
        ) : (
          myCards.map(card => (
            <div 
              key={card.id} 
              style={{ borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', position: 'relative' }}
            >
              <div onClick={() => setSelectedCard(card)} style={{ cursor: 'pointer' }}>
                <img src={card.image} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
                <div style={{ padding: '10px 8px', textAlign: 'center', fontSize: '13px', backgroundColor: '#fcfaf0', color: 'var(--primary)', fontWeight: 'bold' }}>
                  {card.name}
                </div>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('确定要删除此物料卡吗？该卡片也将从之前绑定的帖子中脱落。')) {
                    deleteCard(card.id);
                  }
                }}
                style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: 'rgba(255,255,255,0.92)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', border: 'none' }}
              >
                <Trash2 size={16} color="#ef4444" />
              </button>
            </div>
          ))
        )}
      </div>

      <MaterialModal card={selectedCard} onClose={() => setSelectedCard(null)} />
    </div>
  );
}
