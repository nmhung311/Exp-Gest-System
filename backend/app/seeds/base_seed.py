from typing import List, Type
from app.db.session import SessionLocal


class BaseSeed:
    """Base class for all seed classes"""
    order = 0
    
    def run(self, db):
        """Override this method in subclasses"""
        raise NotImplementedError("Subclasses must implement run method")


# Registry for all seed classes
_REGISTRY: List[Type[BaseSeed]] = []


def register(cls: Type[BaseSeed]) -> Type[BaseSeed]:
    """Decorator to register a seed class"""
    _REGISTRY.append(cls)
    return cls


def run_all():
    """Run all registered seeds in order"""
    db = SessionLocal()
    try:
        # Sort by order and run each seed
        for seed_class in sorted(_REGISTRY, key=lambda x: x.order):
            print(f"Running seed: {seed_class.__name__}")
            seed_class().run(db)
        
        db.commit()
        print("All seeds completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error running seeds: {e}")
        raise
    finally:
        db.close()
