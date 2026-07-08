import { useEffect, useRef } from 'react';

function Dropdown({ align = 'right', children, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handlePointerDown(event) {
      if (ref.current && !ref.current.contains(event.target)) onClose?.();
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.();
    }

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className={`dropdown-panel dropdown-${align}`} role="menu" ref={ref}>
      {children}
    </div>
  );
}

export default Dropdown;
