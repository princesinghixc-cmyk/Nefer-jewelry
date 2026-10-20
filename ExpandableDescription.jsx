import React, { useEffect, useId, useRef, useState } from 'react';
import './ExpandableDescription.css';

/** Shows a compact product description with a control only when it exceeds the requested line count. */
export default function ExpandableDescription({
  text,
  collapsedLines = 3,
  className = '',
  containerClassName = '',
  buttonClassName = '',
  onToggleClick,
}) {
  const contentRef = useRef(null);
  const descriptionId = useId();
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const description = String(text || '').trim();

  useEffect(() => {
    setExpanded(false);
  }, [description]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return undefined;

    const measure = () => {
      if (expanded) {
        setCanExpand(true);
        return;
      }
      setCanExpand(content.scrollHeight > content.clientHeight + 1);
    };

    const frame = window.requestAnimationFrame(measure);
    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    resizeObserver?.observe(content);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
    };
  }, [description, collapsedLines, expanded]);

  if (!description) return null;

  return (
    <div className={`expandable-description ${containerClassName}`.trim()}>
      <p
        ref={contentRef}
        id={descriptionId}
        className={`expandable-description__text ${expanded ? 'is-expanded' : 'is-collapsed'} ${className}`.trim()}
        style={{ '--description-lines': collapsedLines }}
      >
        {description}
      </p>
      {canExpand && (
        <button
          type="button"
          className={`expandable-description__toggle ${buttonClassName}`.trim()}
          aria-expanded={expanded}
          aria-controls={descriptionId}
          onClick={(event) => {
            onToggleClick?.(event);
            if (!event.defaultPrevented) setExpanded(value => !value);
          }}
        >
          {expanded ? 'Show Less' : 'Show More'}
        </button>
      )}
    </div>
  );
}