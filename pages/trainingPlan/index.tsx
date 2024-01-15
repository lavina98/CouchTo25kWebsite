import Navbar from '@/Components/NavBar'
import Image from 'next/image'

export default function Page() {
    
    return (
        <div>
            <Navbar/>
            <Image src="/trainingPlan.jpeg" alt="Running plan" width={1000} height={1000} />
        </div>
    )
}