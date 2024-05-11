import { useEffect, useState } from "react";
import "../styles/App.css";

interface Game {
  name: string;
  appid: number;
}

const imageURL: string = "https://cdn.akamai.steamstatic.com/steam/apps/";
const imageURLEnd: string = "/header.jpg";

function App() {
  //const [count, setCount] = useState(0);

  const [backend, setBackendData] = useState<Game[]>([]);

  //Fetch the game data from the backend (API or Database determined by server)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:3000/");
        const data = await response.json();
        setBackendData(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  console.log("FROM /API : ", backend);

  const imageIds: number[] = backend.map((image) => {
    return image.appid;
  });

  //console.log("NAMES ", images);

  return (
    <>
      <div className="image-gallery">
        {imageIds.map((id, index: number) => (
          <img key={index} src={imageURL + id + imageURLEnd}></img>
        ))}
      </div>
    </>
  );
}

export default App;
