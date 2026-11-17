import Navbar from '@/components/Navbar'
import Image from 'next/image';

export default function NotFound(){
    return(
        <main>
            <Navbar />
            <h1> Error 404 </h1>
            <h3> Esta página no existe hermano </h3>
            <p> Mira este gato mientras piensas en tus actos </p>
            <Image src="/notfoundcat.gif" alt="cat dancing" width={286} height={320} loading='eager' />
        </main>
    );
}