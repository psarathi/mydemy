import { promises as fs } from "fs";
import path from "path";
import Landing from "../components/layout/Landing";
import styles from "../styles/Home.module.css";

export default function Home({ files }) {
  return (
    <div className={styles.container}>
      <Landing files={files} />
    </div>
  );
}

export async function getStaticProps() {
  const currentDirectory = path.join(process.cwd(), "public");
  console.log(currentDirectory);
  const filenames = await fs.readdir(currentDirectory);

  const files = filenames.map((filename) => {
    const filePath = path.join(currentDirectory, filename);

    return {
      filePath,
    };
  });
  // By returning { props: { posts } }, the Blog component
  // will receive `posts` as a prop at build time
  return {
    props: {
      files,
    },
  };
}
