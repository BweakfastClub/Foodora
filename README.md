[Documentation for the API](https://documenter.getpostman.com/view/5738231/RzZ3K24u)

To setup mongo with docker:
```bash
docker pull mongo
docker run --name mongodb -p 127.0.0.1:27017:27017 -d mongo
```
To deploy this project on a VM:
- `git clone https://github.com/BweakfastClub/Foodora.git`
- Then change directory to `Foodora`
- `docker pull mongo`
- `docker build -t foodora/backend .` [Dot is important it tells what directory to use to build image from, in our case Foodora directory]
- `docker-compose -f docker-compose.yml up -d foodora`
- Then you will get log message saying done
