export default function Home() {
    const items = Array(10).fill('VSS');

    return (
        <div>
            <div className="marquee-wrapper">
                <div className="marquee">
                    {/* Render original items */}
                    {items.map((text, i) => (
                        <span key={`original-${i}`} className="item">{text}</span>
                    ))}
                    {/* Render duplicated items for seamless looping */}
                    {items.map((text, i) => (
                        <span key={`duplicate-${i}`} className="item">{text}</span>
                    ))}
                </div>
            </div>

            <div className="vigilance-feature">
                <h2>Vigilance Monitoring</h2>
                <p>
                    Real-time case tracking with hierarchical access control.<br />
                    Assigned officers update case status securely.<br />
                    Intelligent filters & Excel export to streamline your workflow.<br />
                    Seamless case transfer between officers for smooth closure.
                </p>
            </div>
        </div>
    );
}
