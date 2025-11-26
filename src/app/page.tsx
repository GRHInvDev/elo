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
  let user;
  
  try {
    user = await currentUser();
  } catch (error) {
    // Em caso de erro, tratar como não autenticado
    user = null;
  }
  
  if (user) {
    redirect("/dashboard")
  } else {
    redirect("/sign-in")
  }
}

