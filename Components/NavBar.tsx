import Link from "next/link";
import styles from './Styles/Navbar.module.css'


export default function Navbar() {
    return (
        <div className = {styles.navbarStyles}>
            <Link href='/trainingPlan'> View Training plan</Link>
            <Link href='/history'> View History</Link>
            <Link href='/'> Go to Start page</Link>
        </div>
    )
}