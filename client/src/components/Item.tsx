import Button from "react-bootstrap/Button";

import "../styles/Item.css";

interface ItemProps {
  title: string;
  appid: string;
}

const imageURL: string = "https://cdn.akamai.steamstatic.com/steam/apps/";
const imageURLEnd: string = "/header.jpg";

//Get the id numbers for each image (better suited for item)
function getImageURL(id: string) {
  return imageURL + id + imageURLEnd;
}

//Display the game and its image
function Item(props: ItemProps) {
  return (
    <>
      <div className="custom-card">
        <img className="card-image" src={getImageURL(props.appid)} />

        <div className="card-body">
          <h2>{props.title}</h2>
          <p>
            Some quick example text to build on the card title and make up the
            bulk of the card's content.
          </p>
          <Button variant="primary">Go somewhere</Button>
        </div>
      </div>
    </>
  );
}

export default Item;
