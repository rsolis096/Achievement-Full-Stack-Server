import { useEffect, useState } from "react";
import Item from "../components/Item.tsx";
import "../styles/List.css";

interface Game {
  name: string;
  appid: number;
  has_community_visible_stats: boolean;
}

function List() {
  //const [count, setCount] = useState(0);

  const [userLibraryState, setUserLibraryState] = useState<Game[]>([]);

  //Fetch the game data from the backend (API or Database determined by server)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:3000/");
        const data = await response.json();
        setUserLibraryState(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <div className="game-list">
        <ul>
          {userLibraryState.map((item) => (
            <Item
              key={item.appid}
              appid={String(item.appid)}
              title={item.name}
            />
          ))}
        </ul>
      </div>
    </>
  );
}

export default List;
