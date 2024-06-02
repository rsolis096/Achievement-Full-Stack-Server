import { Game } from "../interfaces/types";

import {ListItem, ListItemButton, ListItemText} from "@mui/material";

import "../styles/GameItem.css";

interface GameItemProps {
  game: Game;
}

const imageURL: string = "https://cdn.akamai.steamstatic.com/steam/apps/";
const imageURLEnd: string = "/header.jpg";

//Get the id numbers for each image (better suited for item)
function getImageURL(id: string) {
  return imageURL + id + imageURLEnd;
}

//Display the game and its image
function GameItem(props: GameItemProps) {
  return (
    <>
        <ListItem className="nav-link-custom">
          <ListItemButton className = "tab-content">
              <img
                  alt = "game image"
                className="tab-image"
                src={getImageURL(String(props.game.appid))}
              />
              <ListItemText className="tab-title">{props.game.name}</ListItemText>
          </ListItemButton>
        </ListItem>
    </>
  );
}

export default GameItem;
