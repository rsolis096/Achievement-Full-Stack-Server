import { useEffect, useState } from "react";
import GameCard from "./GameCard.tsx";
import "../styles/List.css";

interface Achievement {
  icon: string;
  name: string;
  icongray: string;
  description: string;
  displayName: string;
}

interface Game {
  appid: number;
  name: string;
  playtime_forever: number;
  img_icon_url: string;
  has_community_visible_stats: boolean;
  achievements: Achievement[];
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
            <GameCard key={item.appid} game={item} />
          ))}
        </ul>
      </div>
    </>
  );
}

export default List;
