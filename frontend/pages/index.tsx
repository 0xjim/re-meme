import axios from "axios";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import CreateFromPublicationStep from "../components/CreateFromPublicationStep";
import { PublicationData } from "../lib/models/Publication/publication.model";
import { RootState } from "../lib/redux/store";
import { setImageSize } from "../lib/redux/slices/imagesize";
import { useSelector } from "react-redux";
import { getRandomMemePublication } from "../lib/server/randomMeme";

type HomeProps = {
  publication: PublicationData | null
}

const Home = ({ publication }: HomeProps) => {
    const router = useRouter()
    const dispatch = useDispatch();
    const refreshNonce = useSelector((state: RootState) => state?.refresh?.nonce ?? 0)
    const [currentPublication, setCurrentPublication] = useState<PublicationData | null>(publication)
    const didMount = useRef(false)

    useEffect(() => {
      if (!didMount.current) {
        didMount.current = true
        return
      }
      axios.get<{ publication: PublicationData | null }>('/api/random-meme')
      .then(({ data }) => {
        if (data.publication) {
          setCurrentPublication(data.publication)
        }
      })
      .catch(() => null)
    }, [refreshNonce])
    
    const handleRemixMeme = () => {
      if (!currentPublication) return
      router.push(`/meme/${currentPublication.id}/edit`)
      dispatch(setImageSize(false))
    }

    if (!currentPublication) return null
  
    return <CreateFromPublicationStep publication={currentPublication} handleRemixMeme={handleRemixMeme} />
}

export const getServerSideProps = async () => {
  const selectedPublication = await getRandomMemePublication()
  return { props: {
    publication: selectedPublication
  }}
}

export default Home;
