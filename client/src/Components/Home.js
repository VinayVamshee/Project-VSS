export default function Home() {
    const items = Array(10).fill('SECR Vigilance Branch');

    return (
        <div className="mainPage">
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
                    Our system offers real-time case tracking, enabling supervisors and officers to monitor the progress of every investigation instantly. With hierarchical access control, sensitive data is protected, ensuring only authorized personnel can view or update case information.<br /><br />

                    Assigned officers can securely update case statuses, upload evidence, and add detailed notes at any time, ensuring transparency and accountability throughout the investigation process.<br /><br />

                    Advanced intelligent filters allow you to sort and search cases by priority, date, officer, or status, saving valuable time and improving focus on critical issues.<br /><br />

                    Export your filtered data effortlessly to Excel, enabling comprehensive reporting, data analysis, and easy sharing with stakeholders.<br /><br />

                    The system supports seamless case transfer between officers or departments, facilitating smooth handovers without data loss or delays, accelerating case resolution and closure.<br /><br />

                    Additional features include automated reminders for pending actions, audit trails to track every change made, and customizable dashboards to visualize case trends and performance metrics.<br /><br />

                    Designed with security and efficiency in mind, this vigilance monitoring platform empowers law enforcement and compliance teams to enhance productivity, maintain accountability, and uphold the highest standards of integrity.
                </p>
            </div>
            <div className="explore-more">
                <p style={{ fontSize: '2rem', }}> Explore More Applications Here...</p>
                <div className="websites">
                    <a href="https://vigilance-secr.vercel.app/" target="_blank" rel="noreferrer" className="website">
                        <img src="https://i.ibb.co/G3FGV4WJ/Whats-App-Image-2025-02-01-at-17-51-50.jpg" alt="IRWSI" />
                        <div>IRWSI</div>
                    </a>
                    {/* <a href="https://ccc-secr-bsp.vercel.app/" target="_blank" rel="noreferrer" className="website">
                        <img src="https://i.ibb.co/dwLQ69hd/android-chrome-512x512.png" alt="CCC" />
                        <div>CCC</div>
                    </a> */}
                </div>
            </div>

        </div>
    );
}
