
import { useState } from "react";
import TabMenu from "./tabMenu";
import './css/navbar.css'

function Tab({titulo, tabClick, actualTab}){
    if(actualTab == titulo){
        return(
            <button onClick={tabClick} className="tabSelected"> {titulo} </button>
        );
    }
    else{
        return(
            <button onClick={tabClick} className="tab"> {titulo} </button>
        );
    }
}

export default function MainMenu({alumno}){
    const [actualTab, setTab] = useState("Mis Cursos");

    return(
        <div className="mainmenu">
            <div className="navbar">
                <Tab titulo={"Mis Cursos"} tabClick={() => setTab("Mis Cursos")} actualTab={actualTab} />
                <Tab titulo={"Cursos"} tabClick={() => setTab("Cursos")} actualTab={actualTab} />
                
            </div>
            <TabMenu actualTab={actualTab} alumno={alumno} />
        </div>
    );
}