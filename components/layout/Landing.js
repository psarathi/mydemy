import React from "react";

function Landing({ files }) {
  return (
    <div>
      <ul>
        {files.map((file, i) => (
          <li key={i}>{file.filePath}</li>
        ))}
      </ul>
    </div>
  );
}

export default Landing;
