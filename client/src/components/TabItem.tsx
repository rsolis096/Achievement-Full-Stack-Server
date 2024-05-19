import Nav from "react-bootstrap/Nav";
import "../styles/TabItem.css";

interface TabItemProps {
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
function TabItem(props: TabItemProps) {
  return (
    <>
      <Nav.Item className="nav-item-custom">
        <Nav.Link eventKey={props.game.appid} className="nav-link-custom">
          <div className="tab-content">
            <img
              className="tab-image"
              src={getImageURL(String(props.game.appid))}
            />
            <p className="tab-title">{props.game.name}</p>
          </div>
        </Nav.Link>
      </Nav.Item>
    </>
  );
}

export default TabItem;
