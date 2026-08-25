import './StatusStamp.css';

export default function StatusStamp({ finished = false }) {
  const label = finished ? '换完了' : '交换中';
  const src = finished ? '/stamps/status-finished.png' : '/stamps/status-active.png';

  return (
    <img
      className={`status-stamp ${finished ? 'is-finished' : 'is-active'}`}
      src={src}
      alt={label}
      width="1200"
      height={finished ? '771' : '772'}
      draggable="false"
    />
  );
}
