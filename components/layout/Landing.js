import Link from 'next/link';
import React from 'react';

function Landing({files}) {
    return (
        <div>
            <ul>
                {files.map((file, i) => (
                    <li key={i}>
                        <Link href={`/${file}`}>
                            <a>{file}</a>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Landing;
