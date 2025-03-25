/**
 *               O dragão do Delphi protege essa aplicação 
 * 
 *                      \    ``~~--,,__                /   /
 *                   /              ``~~--,,_     //--//
 *        _,,,,-----,\              ,,,,---- >   (c  c)\
 *    ,;''            `\,,,,----''''   ,,-'''---/   /_ ;___        -,_
 *   ( ''---,;====;,----/             (-,,_____/  /'/ `;   '''''----\ `:.
 *   (                 '               `      (oo)/   ;~~~~~~~~~~~~~/--~
 *    `;_           ;    \            ;   \   `  ' ,,'
 *       ```-----...|     )___________|    )-----'''
 *                   \   /             \   \\
 *                   /  /,              `\   \\
 *                 ,'---\ \              ,---`,;,
 * 
 *           Em homenagem aos míticos dragões do Zada Web
 */
import { redirect } from "next/navigation"
import { currentUser } from "@clerk/nextjs/server"

export default async function HomePage() {
  const user = await currentUser()
  if (user) {
    redirect("/dashboard")
  } else {
    redirect("/sign-in")
  }
}

