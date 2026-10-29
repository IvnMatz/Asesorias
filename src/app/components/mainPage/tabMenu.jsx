import TablaInscripciones from "./inscripciones";
import ListaCursos from "./cursos";

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
                <ListaCursos />
            </div>
        );
    }
    
}