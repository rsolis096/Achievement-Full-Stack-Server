//This component describes the Achievement Pane body
//This component handles logic on the scale of the entire list

import {useEffect, useState} from "react";

import AchievementItem from "./AchievementItem";

import axios, {AxiosResponse} from "axios";

import {Achievement, GlobalAchievement, TotalAchievement,} from "../interfaces/types";

import "../styles/AchievementList.css";


interface AchievementListProps {
  items: Achievement[];
  appid: number;
  name: string;
  sort : number;
  visibleItems: boolean[];
}

function AchievementList(props: AchievementListProps) {

    //This state variable holds all the combined achievement data
    const [totalData, setTotalData] = useState<
    TotalAchievement[]
    >([]);

    const [loading, setLoading] = useState(true);

    //Make a post request to the server to get user achievement info
    const postUserAchievementData = async () : Promise<TotalAchievement[]>  => {
        try{
            const response: AxiosResponse<TotalAchievement[]> = await axios.post(
                "http://localhost:3000/api/achievements/getAchievements",
                {
                    appid: props.appid,
                    headers: {
                        "Content-Type": "application/json",
                    }
                }
            );
            setTotalData(response.data)
            return response.data
        } catch(err) {
        console.log(err)
    }
    return [];
    };

    //Make a post request to the server to get global achievement info
    const postGlobalAchievementData = async () : Promise<GlobalAchievement[]>  => {
        try {
            const response: AxiosResponse<GlobalAchievement[]> = await axios.post(
                "http://localhost:3000/api/achievements/getGlobalAchievements",
                {
                    appid: props.appid,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
            //setGlobalAchievementData(response.data)
            return response.data;
        } catch(err) {
            console.log(err)
        }
        return [];
    };


    useEffect(() => {
        console.log("useEffect Called");
        const fetchData = async () => {
            //fetch user and global achievement data
            const userAchievements: TotalAchievement[] = await postUserAchievementData();
            const globalAchievements: GlobalAchievement[] = await postGlobalAchievementData();

            //Set loading to false once everything has been fetched and set
            setLoading(false);

            // Combine data after both fetches are complete
            if (userAchievements.length > 0 && globalAchievements.length > 0) {
                const combinedData: TotalAchievement[] = userAchievements.map((userAchievement) => {
                    const globalAchievement = globalAchievements.find(
                        (ga) => ga.name === userAchievement.apiname
                    );

                    return {
                        ...userAchievement,
                        globaldata: globalAchievement,
                        achievementinfo: props.items.find(item => item.name === userAchievement.apiname)
                    };
                });

                setTotalData(combinedData);
            }
        };

        fetchData();
    }, []);

    //Wait until totalData has been completed
    if (loading) {
        return <div>Loading...</div>;
    }

    //Render achievement list
    return (
        <>
            {totalData.length > 0 && !loading ? (
                <div>
                    {/*Sort the Achievement Data */}
                    {totalData
                        .sort((a, b) => {

                            if (props.sort == -1 || props.sort == 0){
                                return (a.globaldata?.percent ?? 0) - (b.globaldata?.percent ?? 0)
                            }
                            if (props.sort == 1){
                                return (b.globaldata?.percent ?? 0) - (a.globaldata?.percent ?? 0)
                            }
                            return 0;
                        })
                        //hide locked achievements
                        .filter((item) => {
                            //If the item is unlocked, check if it should be returned
                            if (item.achieved == 1 ){
                                return !props.visibleItems[1]
                            }
                            if (item.achieved == 0 ){
                                return !props.visibleItems[0]
                            }

                        })
                        .map((a) => <AchievementItem key={a.apiname} data={a} />)
                    }
                </div>
            ) : <div>No user achievements found.</div>}
        </>
    );
}

export default AchievementList;

