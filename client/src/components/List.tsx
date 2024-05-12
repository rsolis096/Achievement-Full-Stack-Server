import { useEffect, useState } from "react";
import Item from "../components/Item.tsx";
import "../styles/List.css";

interface Game {
  name: string;
  appid: number;
}

function List() {
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

  console.log("GAME DATA FROM /API : ", backend);

  return (
    <>
      <div className="game-box">
        {backend.map((item) => (
          <Item key={item.appid} appid={String(item.appid)} title={item.name} />
        ))}
      </div>
    </>
  );
}

export default List;
