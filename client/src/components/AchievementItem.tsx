//This Component describes the actual individual items of the achievement list
//This component handles only one individual achievement item per instance
import { UserAchievement } from "../interfaces/types";
import ListGroup from "react-bootstrap/ListGroup";
import "../styles/AchievementItem.css";

interface AchivementItemProps {
  appid: number;
  stats: UserAchievement;
}

function AchievementItem(props: AchivementItemProps) {
  return (
    <>
      <ListGroup horizontal className="ach-card" key={props.appid}>
        <ListGroup.Item className="ach-image">
          <img
            className="ach-image-display"
            src={
              props.stats.achieved === 1
                ? props.stats.icon
                : props.stats.icongray
            }
            alt={props.stats.displayName}
          />
        </ListGroup.Item>

        <ListGroup.Item className="ach-body">
          <h3>{props.stats.displayName}</h3>
          <p>{props.stats.description}</p>
        </ListGroup.Item>

        <ListGroup.Item className="unlock-info">
          <p>Unlocked : {props.stats.achieved === 1 ? "True" : "False"}</p>
        </ListGroup.Item>

        <ListGroup.Item className="unlock-info">
          <p>Percentage : {props.stats.percent}</p>
        </ListGroup.Item>

        <ListGroup.Item className="unlock-info">
          <p>game : {props.stats.name}</p>
          <p>user : {props.stats.apiname}</p>
          <p>global : {props.stats.otherName}</p>
        </ListGroup.Item>
      </ListGroup>
    </>
  );
}

export default AchievementItem;
