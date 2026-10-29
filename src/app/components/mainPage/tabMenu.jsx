import TablaInscripciones from "./inscripciones";

export default function TabMenu({actualTab, alumno}){

    if(actualTab == "Mis Cursos"){
        return(
            <div className="content">
                <h1> {actualTab} </h1>
                <TablaInscripciones matricula={alumno.matricula}/>
            </div>
        );
    }
    else if(actualTab == "Cursos"){
        return(
            <div className="content">
                <h1> {actualTab} </h1>
            </div>
        );
    }
    else if(actualTab == "Buscar"){
        return(
            <div className="content">
                <h1> {actualTab} </h1>
            </div>
        );
    }
}