import React from 'react';

function Paddle({player, name, left}) {
  return <div className={`floating-paddle paddle-player-${player} paddle-${left ? 'left' : 'right'}`} aria-hidden="true">
    <div className="paddle-hover">
      <svg viewBox="0 0 100 150" focusable="false">
        <ellipse className="paddle-edge" cx="50" cy="49" rx="35" ry="42"/>
        <path className="paddle-handle-edge" d="M42 80h16l4 52q0 9-12 9t-12-9z"/>
        <path className="paddle-handle" d="M44 81h12l3 50q0 7-9 7t-9-7z"/>
        <path className="paddle-grain" d="m47 94-2 35m7-34 3 35"/>
        <ellipse className="paddle-rubber" cx="50" cy="47" rx="32" ry="39"/>
        <ellipse className="paddle-highlight" cx="42" cy="32" rx="20" ry="24"/>
        <path className="paddle-seam" d="M25 66q25 21 50 0"/>
        <text x="50" y="58" textAnchor="middle">{name.slice(0,1).toLocaleUpperCase('tr')}</text>
      </svg>
    </div>
    <span className="paddle-floor-shadow"/>
  </div>;
}

export default function FloatingPaddles({names, side, hidden, paused}) {
  return <div className={`paddle-layer ${hidden ? 'paddles-hidden' : ''} ${paused ? 'paddles-paused' : ''}`} aria-hidden="true">
    {names.map((name, player) => <Paddle key={player} player={player} name={name} left={player === side}/>)}
  </div>;
}
