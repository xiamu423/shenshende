import './MaterialModal.css';

export default function MaterialModal({ card, onClose }) {
  if (!card) return null;

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="material-modal animate-pop" onClick={e => e.stopPropagation()}>
        <div className="modal-tape"></div>
        <div className="modal-content">
          <div className="modal-image">
            <img src={card.image} alt="物料" onClick={() => window.open(card.image)} />
          </div>
          <div className="modal-details">
            <h3 className="modal-title">物料名称：{card.name}</h3>
            <p><strong>时间：</strong>{card.time}</p>
            <p><strong>地点：</strong>{card.location}</p>
            <p><strong>物料主：</strong>{card.owner}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
