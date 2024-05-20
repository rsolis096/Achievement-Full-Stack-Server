//This Component describes the actual individual items of the achievement list
//This component handles only one individual achievement item per instance
import Col from "react-bootstrap/Col";
import "../styles/PaneBody.css";
import { Achievement, UserAchievement } from "../interfaces/types";

interface AchivementItemProps {
  item: Achievement;
  appid: number;
  unlock_info: UserAchievement;
}

function PaneItem(props: AchivementItemProps) {
  return (
    <>
      <div className="ach-card" key={props.appid}>
        <Col xl={1}>
          <img
            className="ach-image"
            src={
              props.unlock_info.achieved === 1
                ? props.item.icon
                : props.item.icongray
            }
            alt={props.item.displayName}
          />
        </Col>

        <Col xl={8}>
          <div className="ach-body">
            <h3>{props.item.displayName}</h3>
            <p>{props.item.description}</p>
          </div>
        </Col>

        <Col xl={4} className="unlock-info">
          <p>
            Unlocked : {props.unlock_info.achieved === 1 ? "True" : "False"}
          </p>
        </Col>
      </div>
    </>
  );
}

export default PaneItem;
