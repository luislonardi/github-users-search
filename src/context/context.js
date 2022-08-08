import React, { useState, useEffect,useContext } from 'react';
import mockUser from './mockData.js/mockUser';
import mockRepos from './mockData.js/mockRepos';
import mockFollowers from './mockData.js/mockFollowers';
import axios from 'axios';

const rootUrl = 'https://api.github.com';
const GithubContext=React.createContext();

const GithubProvider=({children})=>{
    const [githubUser,setGithubUser]= useState(mockUser)
    const [repos,setRepos] = useState(mockRepos)
    const [followers,setFollowers] = useState(mockFollowers)
    //request loading
    const [requests,setRequests]= useState(0);
    const [isLoading,setIsLoading]= useState(false);
    //errors
    const [error,setError]=useState({show:false,msg:""})

    // search users api
    const searchGithubUser= async (user)=>{
        //toggle error use the default values
        toggleError()
        setIsLoading(true)
        //fetch the user
        const response = await axios(`${rootUrl}/users/${user}`)
            .catch((err)=>{
                toggleError(true,'there is no user with that username')
                setIsLoading(false)
            })
           
        if(response){
            setGithubUser(response.data)
            const {login,followers_url}=response.data;

            await Promise.allSettled([
                axios(`${rootUrl}/users/${login}/repos?per_page=100`),
                axios(`${followers_url}?per_page=100`)
            ]).then((results)=>{
                const [repos,followers]=results;
                const status= 'fulfilled';
                if(repos.status===status){
                    setRepos(repos.value.data)
                }
                if(followers.status===status){
                    setFollowers(followers.value.data)
                }
            });
            setIsLoading(false)
        }
    //search for followers    

        
    }
    
    //check rate
        const checkRequests= ()=>{
            axios(`${rootUrl}/rate_limit`)
                .then((data)=>{
                    let {data:{rate:{remaining}}}=data
                    setRequests(remaining)
                    if(remaining===0){
                        let msg='sorry, you have exceeded your hourly rate limit'
                        toggleError(true,msg)
                    }
                   
                })
                .catch((err)=>console.log(err))
        }
    function toggleError(show=false,msg=''){
        setError({show,msg})
    }    
    //error
    useEffect(checkRequests,[])

    return <GithubContext.Provider
    value={{
        githubUser,
        repos,
        followers,
        requests,
        error,
        searchGithubUser,
        isLoading,
    }}
    >
    {children}
    </GithubContext.Provider>
}

export {GithubProvider,GithubContext}