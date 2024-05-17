import { useState } from "react";

import Button from "react-bootstrap/Button";
import Collapse from "react-bootstrap/Collapse";

import "../styles/Item.css";

interface ItemProps {
  game: Game;
}

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

const imageURL: string = "https://cdn.akamai.steamstatic.com/steam/apps/";
const imageURLEnd: string = "/header.jpg";

//Get the id numbers for each image (better suited for item)
function getImageURL(id: string) {
  return imageURL + id + imageURLEnd;
}

//Display the game and its image
function Item(props: ItemProps) {
  const [displayAchievements, setDisplayAchievements] =
    useState<boolean>(false);

  const listItems = props.game.achievements.map((a) => (
    <li key={a.name}>{a.displayName}</li>
  ));

  const buttonListener = () => {
    setDisplayAchievements(!displayAchievements);
  };

  return (
    <>
      <div className="custom-card">
        <div className="custom-card-upper ">
          <img
            className="card-image"
            src={getImageURL(String(props.game.appid))}
          />

          <div className="card-body">
            <h2>{props.game.name}</h2>

            <Button variant="primary" onClick={buttonListener}>
              Reveal Achievements
            </Button>
          </div>
        </div>

        <Collapse in={displayAchievements}>
          <div className="achievements-body">
            {displayAchievements == true && (
              <ul className="achievements-item">{listItems}</ul>
            )}
          </div>
        </Collapse>
      </div>
    </>
  );
}

export default Item;
