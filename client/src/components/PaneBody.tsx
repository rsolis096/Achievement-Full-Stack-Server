import "../styles/PaneBody.css";

interface Achievement {
  icon: string;
  name: string;
  icongray: string;
  description: string;
  displayName: string;
}

interface UserAchievement {
  apiname: string;
  achieved: number;
  unlocktime: number;
}

interface AchivementItemProps {
  item: Achievement;
  appid: number;
  unlock_info: UserAchievement;
}

function PaneBody(props: AchivementItemProps) {
  return (
    <>
      <div className="ach-card" key={props.appid}>
        <img
          className="ach-image"
          src={
            props.unlock_info.achieved === 1
              ? props.item.icon
              : props.item.icongray
          }
          alt={props.item.displayName}
        />
        <div className="ach-body">
          <h3>{props.item.displayName}</h3>
          <p>{props.item.description}</p>
        </div>
      </div>
    </>
  );
}

export default PaneBody;
