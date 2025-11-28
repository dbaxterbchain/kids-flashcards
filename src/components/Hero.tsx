export function Hero() {
  return (
    <header className="hero">
      <div>
        <p className="tag">Spark curiosity</p>
        <h1>Kids Flashcards</h1>
        <p className="lede">
          Flip lively, colorful cards to help kids remember words and ideas. Add your own pictures to
          make the deck feel personal and fun!
        </p>
        <ul className="feature-list">
          <li>Flip animations on every card</li>
          <li>Custom pictures from your device</li>
          <li>Save cards locally for quick reuse</li>
        </ul>
      </div>
      <div className="sparkle" aria-hidden>
        <div className="bubble bubble-1" />
        <div className="bubble bubble-2" />
        <div className="bubble bubble-3" />
      </div>
    </header>
  );
}
